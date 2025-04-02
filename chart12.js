document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data_ggsheet.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        // **Chuyển dữ liệu thành số**
        data.forEach(d => {
            d["Thành tiền"] = +d["Thành tiền"];
        });

        // **Tính tổng doanh thu theo từng phân khúc khách hàng chi tiết**
        const doanhThuPKKH = d3.rollup(
            data,
            v => d3.sum(v, d => d["Thành tiền"]),
            d => d["Mã PKKH"]
        );

        // **Chuyển dữ liệu về mảng**
        const doanhThuArray = Array.from(doanhThuPKKH, ([key, value]) => ({ MaPKKH: key, DoanhThu: value })).sort((a, b) => b.DoanhThu - a.DoanhThu);

        // **Thiết lập kích thước SVG**
        const width = 900, height = 600, margin = { top: 60, right: 200, bottom: 50, left: 250 };

        const svg = d3.select("#chart14")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // **Tạo scale**
        const yScale = d3.scaleBand()
            .domain(doanhThuArray.map(d => d.MaPKKH))
            .range([0, height - margin.top - margin.bottom])
            .padding(0.2);

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(doanhThuArray, d => d.DoanhThu) * 1.1])
            .nice()
            .range([0, width - margin.left - margin.right]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // **Vẽ thanh ngang**
        svg.selectAll(".bar")
            .data(doanhThuArray)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => yScale(d.MaPKKH))
            .attr("x", 0)
            .attr("width", d => xScale(d.DoanhThu))
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.MaPKKH));

        // **Hiển thị nhãn giá trị trên mỗi thanh**
        svg.selectAll(".label")
            .data(doanhThuArray)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.DoanhThu) + 5)
            .attr("y", d => yScale(d.MaPKKH) + yScale.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => d3.format(",.0f")(d.DoanhThu))
            .attr("fill", "black")
            .attr("font-size", "14px");

        // **Thêm trục Y (danh sách Mã PKKH)**
        svg.append("g").call(d3.axisLeft(yScale));

        // **Thêm trục X**
        svg.append("g")
            .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(xScale).tickValues(d3.range(0, xScale.domain()[1] + 1, 200000000))
            .tickFormat(d => `${d / 1000000}M`));

        // **Thêm tiêu đề**
        svg.append("text")
            .attr("x", (width - margin.left - margin.right) / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("font-weight", "bold")
            .attr("fill", "#007bff")
            .text("Doanh thu theo từng Phân khúc khách hàng chi tiết");

        // **Thêm legend**
        const legend = svg.append("g")
            .attr("transform", `translate(${width - margin.right - 100}, 0)`);

        doanhThuArray.forEach((d, i) => {
            legend.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", colorScale(d.MaPKKH));

            legend.append("text")
                .attr("x", 20)
                .attr("y", i * 20 + 12)
                .text(d.MaPKKH)
                .attr("font-size", "14px")
                .attr("fill", "#333");
        });

    }).catch(error => {
        console.error("Error loading CSV:", error);
    });
});
