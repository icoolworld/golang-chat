package main

import (
    "fmt"
    "strings"
	"strconv"
	"bytes"
	"encoding/json"
    "time"
    "flag"
    "net/http"
	"io/ioutil"
	log "github.com/golang/glog"
	"github.com/Terry-Mao/goim/internal/logic/conf"
)

type Response struct {
  Code int
  Message string
  Data []int64 
}

func main() {
	flag.Parse()
	if err := conf.Init(); err != nil {
		panic(err)
	}

    for t := range time.Tick(time.Millisecond  * 500) {
        fmt.Println("Tick at",t)
		go task(conf.Conf)
    }
}

func task(config *conf.Config) {

	var params []string
	params = append(params,"/online/match-mids")
	matchMidsUrl := makeUrl(config, params)
	res := httpGet(matchMidsUrl)

    midsLen := len(res.Data)
	if midsLen < 2 {
		return
	}

	fmt.Println("start do task")

	users := make(map[string]map[string]int64)
	users["firstUser"] = map[string]int64{"sendTo": res.Data[0], "from": res.Data[1]}
	users["secondUser"] = map[string]int64{"sendTo": res.Data[1], "from": res.Data[0]}

	for _, user := range users {
		var params []string
		params = append(params,"/push/mids?operation=1000&mids=")
		params = append(params, strconv.FormatInt(user["sendTo"],10))
		sendToMidUrl := makeUrl(config,params)
		postData := fmt.Sprintf(`{"data":"Hi, 很高兴认识你！","userid":%d,"chatType":"single"}`, user["from"])
		res := httpPost(sendToMidUrl, postData) 
    	fmt.Println("post res:", res)
	}
}


func httpGet(url string) (res Response){
    resp, err := http.Get(url)
    defer resp.Body.Close()
    if err != nil {
		log.Errorf("goim-ticker http get error %v",err)
		return
    }
    bodyBytes, err := ioutil.ReadAll(resp.Body)
    if err != nil {
		log.Errorf("goim-ticker http get ioutil error %v",err)
		return
    }
	var jsonData Response
	json.Unmarshal(bodyBytes, &jsonData)
	res = jsonData
	return
}

func httpPost(url string, body string) (res string){
    fmt.Println("post URL:", url)
    fmt.Println("post DATA:", body)

    var jsonStr = []byte(body)
    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonStr))
    req.Header.Set("X-Custom-Header", "myvalue")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    fmt.Println("response Status:", resp.Status)
    fmt.Println("response Headers:", resp.Header)
    respData, _ := ioutil.ReadAll(resp.Body)
    fmt.Println("response Body:", string(respData))
	res =  string(respData)
	return
}

func makeUrl(config *conf.Config, params []string) (url string) {
	host := config.Env.Host
	port := config.HTTPServer.Addr

	var data []string
	data = append(data, "http://")
	data = append(data, host)
	data = append(data, port)
	data = append(data, "/goim")
	data = append(data, params...)

	url = concatString(data)
	return
}

func concatString(params []string) (res string){
    var str strings.Builder
	for _, val := range params {
    	str.WriteString(val)
	}
	res = str.String()
    fmt.Println("concat res string:", res)
	return
}
